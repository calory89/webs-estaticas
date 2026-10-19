const e=e=>e.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-zA-Z0-9.-]/g,"_").replace(/_+/g,"_").substring(0,100);export{e as s};
