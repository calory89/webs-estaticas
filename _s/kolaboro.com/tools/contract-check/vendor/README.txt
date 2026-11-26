Third-party code used by /tools/contract-check/ and /tools/permit-check/, copied byte for byte from npm.
Check: download the npm tarball and compare, or compare the SHA-384 below with `openssl dgst -sha384 -binary FILE | base64`.

web-llm-0.2.86.js            @mlc-ai/web-llm 0.2.86, lib/index.js          Apache-2.0  https://github.com/mlc-ai/web-llm
  sha384-HegQbcXEuX71lg9KuPsNblVYf0qx8SYwjMgeIdIaUisFt2g5p4IHo6YtxdUtZP25
pdf-4.10.38.min.mjs          pdfjs-dist 4.10.38, build/pdf.min.mjs         Apache-2.0  https://github.com/mozilla/pdf.js
  sha384-+0ti2moQlmLN7WZHE2RHIf5lV8hHxhxEalN0il3YZceG26fUPyOkR0hp9daxk1i7
pdf-4.10.38.worker.min.mjs   pdfjs-dist 4.10.38, build/pdf.worker.min.mjs  Apache-2.0
  sha384-ToeVvShCxKc6CEvhHeMt0Q8A06pSPDbAlngO9nokrDmh914gk/pYd0N7D0a4Lz2o
../../permit-check/vendor/jsQR-1.4.0.js   jsqr 1.4.0, dist/jsQR.js        Apache-2.0  https://github.com/cozmo/jsQR
  sha384-b5Ya4Bq3qCyz39m2ISh+4DxjAIljdeFwK/BsXLuj9gugaNwAcj/ia15fxNZL9Nlx

Model weights are not hosted here: WebLLM downloads them from huggingface.co/mlc-ai (Qwen2.5 Instruct, Apache-2.0)
and the compiled GPU library from raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs (path v0_2_86/base).
