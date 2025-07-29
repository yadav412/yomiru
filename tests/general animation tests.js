var gemini = require('gemini');

gemini.suite('homepage', function(suite) {
  suite.setUrl('/')
    .setCaptureElements('body')
    .before(function(actions, find) {
      actions.wait(2000); // Wait for animations / content
    })
    .capture('plain');
});

gemini.suite('form-test', function(suite) {
  suite.setUrl('/form.html')
    .setCaptureElements('#form-container')
    .before((actions, find) => {
      actions.waitForElementToShow('#form-container', 2000);
      actions.sendKeys('#name', 'Yadav');
      actions.click('#submit-btn');
    })
    .capture('submitted');
});
