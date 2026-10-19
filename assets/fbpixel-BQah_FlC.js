const o=(f,d)=>{try{typeof window<"u"&&window.fbq&&(d?window.fbq("track",f,d):window.fbq("track",f))}catch{}},w=f=>o("Lead",f);export{w as fbLead,o as fbTrack};
