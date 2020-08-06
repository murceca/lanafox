$(function () {
  $('.js-contact-form').submit(function (event) {
    event.preventDefault();
    const $contactForm = $(this);
    const nameVal = $contactForm.find('.js-name-field').val();
    const emailVal = $contactForm.find('.js-email-field').val();
    const messageVal = $contactForm.find('.js-message-field').val();
    $.post('/contact', {
      name: nameVal,
      email: emailVal,
      message: messageVal
    })
      .done(data => {
        console.log('Done: ' + data);
      })
      .fail(error => {
        console.log('Error: ' + error);
      });
  });
});