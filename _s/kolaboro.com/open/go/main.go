// kolaboro-verify (Go) 1.0, 3 Nov 2026, MIT licence. Independent checks of Kolaboro's public records using only the Go standard library.
// Same checks and answers as kolaboro-verify.js and kolaboro_verify.py; all three run against test-vectors.json and the live site daily.
//
//	go run . vectors ../test-vectors.json
//	go run . live
package main

import (
	"bytes"
	"crypto/ed25519"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"sort"
	"strconv"
	"strings"
)

const publicKey = "rnY6UvDI+L6e8j3a+UPwmddQJFapkfmEXWwHuXzdmzw=" // also at https://kolaboro.com/.well-known/kolaboro-keys.json

func h(b ...[]byte) []byte {
	s := sha256.New()
	for _, x := range b {
		s.Write(x)
	}
	return s.Sum(nil)
}
func leaf(line string) []byte { return h([]byte{0}, []byte(line)) }
func node(l, r []byte) []byte { return h([]byte{1}, l, r) }
func unhex(s string) []byte   { b, _ := hex.DecodeString(s); return b }
func pub() ed25519.PublicKey {
	b, _ := base64.StdEncoding.DecodeString(publicKey)
	return ed25519.PublicKey(b)
}

type step struct{ Side, Hash string }
type head struct {
	Day, DatasetSha256, ProjectsRoot, EvidenceRoot, AuditHead, Prev, Head string
	ProjectsCount, EvidenceItems, AuditCount                              int
}

func (x *head) UnmarshalJSON(b []byte) error {
	var m map[string]interface{}
	if err := json.Unmarshal(b, &m); err != nil {
		return err
	}
	s := func(k string) string {
		if v, ok := m[k].(string); ok {
			return v
		}
		return ""
	}
	n := func(k string) int {
		if v, ok := m[k].(float64); ok {
			return int(v)
		}
		return 0
	}
	*x = head{s("day"), s("dataset_sha256"), s("projects_root"), s("evidence_root"), s("audit_head"), s("prev"), s("head"), n("projects_count"), n("evidence_items"), n("audit_count")}
	return nil
}

func verifySignature(body []byte, sigB64 string) bool {
	sig, err := base64.StdEncoding.DecodeString(sigB64)
	if err != nil {
		return false
	}
	msg := "kolaboro-sig-v1\n" + hex.EncodeToString(h(body))
	return ed25519.Verify(pub(), []byte(msg), sig)
}
func verifyPath(line string, path []step, rootHex string) bool {
	c := leaf(line)
	for _, s := range path {
		o := unhex(s.Hash)
		if s.Side == "L" {
			c = node(o, c)
		} else {
			c = node(c, o)
		}
	}
	return hex.EncodeToString(c) == rootHex
}
func headHash(x head) string {
	prev := x.Prev
	if prev == "" {
		prev = "genesis"
	}
	canon := strings.Join([]string{"kolaboro-log-v1", x.Day, x.DatasetSha256, x.ProjectsRoot, strconv.Itoa(x.ProjectsCount), x.EvidenceRoot, strconv.Itoa(x.EvidenceItems), x.AuditHead, strconv.Itoa(x.AuditCount), prev}, "|")
	return hex.EncodeToString(h([]byte(canon)))
}
func verifyLog(hs []head) bool {
	sort.Slice(hs, func(i, j int) bool { return hs[i].Day < hs[j].Day })
	for i, x := range hs {
		if headHash(x) != x.Head || (i == 0 && x.Prev != "") || (i > 0 && x.Prev != hs[i-1].Head) {
			return false
		}
	}
	return true
}

// RFC 9162 section 2.1.4.2
func verifyConsistency(m, n int, r1h, r2h string, proofHex []string) bool {
	r1, r2 := unhex(r1h), unhex(r2h)
	if m < 1 || m > n {
		return false
	}
	if m == n {
		return len(proofHex) == 0 && bytes.Equal(r1, r2)
	}
	if len(proofHex) == 0 {
		return false
	}
	var p [][]byte
	if m&(m-1) == 0 {
		p = append(p, r1)
	}
	for _, x := range proofHex {
		p = append(p, unhex(x))
	}
	fn, sn := m-1, n-1
	for fn&1 == 1 {
		fn >>= 1
		sn >>= 1
	}
	fr, sr := p[0], p[0]
	for _, c := range p[1:] {
		if sn == 0 {
			return false
		}
		if fn&1 == 1 || fn == sn {
			fr, sr = node(c, fr), node(c, sr)
			for fn&1 == 0 && fn != 0 {
				fn >>= 1
				sn >>= 1
			}
		} else {
			sr = node(sr, c)
		}
		fn >>= 1
		sn >>= 1
	}
	return sn == 0 && bytes.Equal(fr, r1) && bytes.Equal(sr, r2)
}

// C2SP signed note
func verifyCheckpoint(note string) (bool, int, string) {
	i := strings.Index(note, "\n\n")
	if i < 0 {
		return false, 0, ""
	}
	body := note[:i+1]
	lines := strings.Split(body, "\n")
	size, _ := strconv.Atoi(lines[1])
	rootB, _ := base64.StdEncoding.DecodeString(lines[2])
	kh := h([]byte(lines[0]+"\n"), []byte{1}, pub())[:4]
	for _, l := range strings.Split(note[i+2:], "\n") {
		if !strings.HasPrefix(l, "— "+lines[0]+" ") {
			continue
		}
		f := strings.Fields(l)
		blob, err := base64.StdEncoding.DecodeString(f[len(f)-1])
		if err == nil && len(blob) == 68 && bytes.Equal(blob[:4], kh) && ed25519.Verify(pub(), []byte(body), blob[4:]) {
			return true, size, hex.EncodeToString(rootB)
		}
	}
	return false, size, hex.EncodeToString(rootB)
}

func get(path string) ([]byte, http.Header) {
	req, _ := http.NewRequest("GET", "https://kolaboro.com"+path, nil)
	req.Header.Set("user-agent", "kolaboro-verify-go/1.0")
	r, err := http.DefaultClient.Do(req)
	if err != nil {
		fmt.Println(err)
		os.Exit(2)
	}
	defer r.Body.Close()
	b, _ := io.ReadAll(r.Body)
	return b, r.Header
}

func main() {
	res := map[string]bool{}
	mode := "live"
	if len(os.Args) > 1 {
		mode = os.Args[1]
	}
	if mode == "vectors" {
		file := "../test-vectors.json"
		if len(os.Args) > 2 {
			file = os.Args[2]
		}
		raw, err := os.ReadFile(file)
		if err != nil {
			fmt.Println(err)
			os.Exit(2)
		}
		var V struct {
			Proof struct {
				Line string
				Path []step
			} `json:"proof"`
			LogHeads   []head                           `json:"log_heads"`
			Signature  struct{ Body, Signature string } `json:"signature"`
			Checkpoint struct{ Note string }            `json:"checkpoint"`
			Inclusion  struct {
				Leaf     string
				Path     []step
				RootHash string `json:"root_hash"`
			} `json:"log_inclusion"`
			Consistency struct {
				First, Second int
				FirstRoot     string `json:"first_root"`
				SecondRoot    string `json:"second_root"`
				Proof         []string
			} `json:"log_consistency"`
		}
		if err := json.Unmarshal(raw, &V); err != nil {
			fmt.Println(err)
			os.Exit(2)
		}
		hs := append([]head{}, V.LogHeads...)
		sort.Slice(hs, func(i, j int) bool { return hs[i].Day < hs[j].Day })
		res["proof"] = verifyPath(V.Proof.Line, V.Proof.Path, hs[0].ProjectsRoot)
		res["log"] = verifyLog(V.LogHeads)
		res["signature"] = verifySignature([]byte(V.Signature.Body), V.Signature.Signature)
		res["tamper_rejected"] = !verifySignature([]byte(V.Signature.Body+" "), V.Signature.Signature)
		res["checkpoint"], _, _ = verifyCheckpoint(V.Checkpoint.Note)
		res["inclusion"] = verifyPath(V.Inclusion.Leaf, V.Inclusion.Path, V.Inclusion.RootHash)
		c := V.Consistency
		res["consistency"] = verifyConsistency(c.First, c.Second, c.FirstRoot, c.SecondRoot, c.Proof)
	} else {
		b, hd := get("/api/open/summary")
		res["summary_signed"] = verifySignature(b, hd.Get("x-kolaboro-signature"))
		b, hd = get("/api/open/log")
		res["log_signed"] = verifySignature(b, hd.Get("x-kolaboro-signature"))
		var L struct{ Heads []head }
		json.Unmarshal(b, &L)
		res["log_chain"] = verifyLog(L.Heads)
		nb, _ := get("/api/open/checkpoint")
		ok, size, root := verifyCheckpoint(string(nb))
		res["checkpoint_signed"] = ok
		res["checkpoint_size_matches_log"] = size == len(L.Heads)
		inc, cons := true, true
		for _, x := range L.Heads {
			pb, _ := get("/api/open/log-proof?day=" + x.Day)
			var P struct {
				Leaf     string
				Path     []step
				RootHash string `json:"root_hash"`
			}
			json.Unmarshal(pb, &P)
			inc = inc && P.RootHash == root && verifyPath(P.Leaf, P.Path, root)
		}
		for m := 1; m <= size; m++ {
			cb, _ := get(fmt.Sprintf("/api/open/log-consistency?first=%d&second=%d", m, size))
			var C struct {
				FirstRoot  string `json:"first_root"`
				SecondRoot string `json:"second_root"`
				Proof      []string
			}
			json.Unmarshal(cb, &C)
			cons = cons && C.SecondRoot == root && verifyConsistency(m, size, C.FirstRoot, C.SecondRoot, C.Proof)
		}
		res["every_day_included"], res["append_only"] = inc, cons
	}
	out, _ := json.MarshalIndent(res, "", " ")
	fmt.Println(string(out))
	for _, v := range res {
		if !v {
			os.Exit(1)
		}
	}
}
