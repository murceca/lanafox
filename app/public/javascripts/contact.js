$(function () {
  $('.js-contact-form').submit(function (event) {
    event.preventDefault();
    $('.js-contact-req-failed').hide();
    const $contactForm = $(this);
    const nameVal = $contactForm.find('.js-name-field').val();
    const emailVal = $contactForm.find('.js-email-field').val();
    const messageVal = $contactForm.find('.js-message-field').val();
    $.post('/contact', {
      name: nameVal,
      email: emailVal,
      message: messageVal
    })
      .done(() => {
        $('.js-contact-form').hide(250);
        $('.js-contact-req-delivered').show(500);
      })
      .fail(() => {
        $('.js-contact-req-failed').show();
      });
  });
});