

let url = window.location.pathname;
const btnInfo = document.querySelectorAll('.zos-card');

btnInfo.forEach(function(item){
    let country = item.querySelector('.get-more-info');
    
    
    setTimeout(function(){
        const popup = document.querySelector('.zos-form-info');
        country.addEventListener('click', function(e){
            e.preventDefault();
            popup.classList.add('active');
            document.querySelector('.zos-country-name').textContent = e.target.dataset.country;
            
        });
    },1000)
    
})

document.addEventListener('DOMContentLoaded', () => {
    if(document.querySelector('#zos-filter') !== null){
        document.querySelector('#zos-filter').addEventListener('change', (e) => {
            location = `${url}?filter=` + e.target.options[e.target.selectedIndex].value;
        });
    }
    
    if(document.querySelector('.zos-continents') !== null){
        let continents = document.querySelector('.zos-continents');
        let arrow = document.querySelector('.zos-mobile-arrow');

        continents.addEventListener("scroll", function (e) {
            var horizontal = e.target.scrollLeft;
            var scrollWidth = e.target.scrollWidth;
            if(horizontal < (scrollWidth/2)) {
               // add `display: none` to left button
               // add `display: inline-block` to right button
               document.querySelector('.zos-mobile-arrow').classList.remove('disable');
             } else {
              // add `display: inline-block` to left
              // add `display: none` to right button
              document.querySelector('.zos-mobile-arrow').classList.add('disable');
             }
        });

        arrow.addEventListener("click", function () {
            
            continents.scrollLeft += 150; 
            
        });
    }
    
});

