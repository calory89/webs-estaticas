if(document.querySelector('.filter-mobile') !== null){
    document.querySelector('.filter-mobile').addEventListener('click', function(){
        document.querySelector('.form-wrap').classList.toggle('active');
    })
}

setTimeout(function(){
    if(document.querySelector('.search_categories .select2-search') !== null){
        document.querySelector('.search_categories .select2-search .select2-search__field').placeholder = "Categorías de búsqueda...";
    }
},100);

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(function(){
        console.log(document.querySelector('.job-tags'));
    
            if(document.querySelector('.job-tags') !== null){
                document.querySelectorAll('.job-tags').forEach(function(item){
                   
                    var arrow = item.querySelector('.tags-arrow-mobile');
                    var scrollWidth = item.scrollWidth;
                    var contWidth = item.offsetWidth;
                    if(scrollWidth <= contWidth){
                        arrow.classList.add('disable');
                    }
                    item.addEventListener("scroll", function (e) {
                        var horizontal = e.target.scrollLeft;
                        var scrollWidth = e.target.scrollWidth;
                        var arrow = e.target.querySelector('.tags-arrow-mobile');
                        console.log(horizontal);
                        console.log(scrollWidth);
                        console.log(e.target.offsetWidth + horizontal);
                        console.log(e.target.offsetWidth + horizontal >= scrollWidth);
                        if((e.target.offsetWidth + horizontal) >= scrollWidth - 30){
                            arrow.classList.add('disable');
                        }else if(horizontal < (scrollWidth/2)) {
                            // add `display: none` to left button
                            // add `display: inline-block` to right button
                            arrow.classList.remove('disable');
                        }else {
                            // add `display: inline-block` to left
                            // add `display: none` to right button
                            arrow.classList.add('disable');
                        }
                    });
                
                    arrow.addEventListener("click", function () {
                        item.scrollLeft += 150; 
                    });
                })
                
            }
        
    }, 3000);
});


    

