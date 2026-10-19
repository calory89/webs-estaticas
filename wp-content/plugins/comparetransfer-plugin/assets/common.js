;(function ($, window, document) {
  // BOOTSTRAP SELECT

  $('.ub_btn_compare').on('click', function (e) {
    e.preventDefault();

    let params = $('.ct_main_compare_form').serialize();

    $.ajax ({
      url : ct_ajax_url,
      type: 'POST',
      dataType: 'json',
      data: {
        action: 'ct_send_compare',
        params: params
      },
      success: function (data) {
        window.open(data, '_blank');
      }
    });
  });

  const selectPicker = $('.ub_form_select .selectpicker');

  if(selectPicker.length) {
    selectPicker.selectpicker({
      style: 'btn-info',
      size: 4,
      title: 'Select'
    });

    selectPicker.on('shown.bs.select', function (e) {
      $('.sidebar_container').addClass('active');
    });
    selectPicker.on('hidden.bs.select', function (e) {
      $('.sidebar_container').removeClass('active');
    });
  }

})(jQuery, window, document);