const swiper = new Swiper('.swiper', {
    // Optional parameters
    loop: false,
    slidesPerView: 1,
    spaceBetween: 20,

    breakpoints: {
        768: {
          slidesPerView: 3,
          spaceBetween: 24
        },
        1025: {
            slidesPerView: 4,
            spaceBetween: 24
        }
    },
  
    // If we need pagination
    pagination: {
      el: '.swiper-pagination',
    },
  
    // // Navigation arrows
    // navigation: {
    //   nextEl: '.swiper-button-next',
    //   prevEl: '.swiper-button-prev',
    // },
  
    // // And if we need scrollbar
    // scrollbar: {
    //   el: '.swiper-scrollbar',
    // },
  });