
const vueinst = new Vue({
  el: "#app",
  data: {
    showing_dog: false,
    imageurl: null,
  }
});

function getDogImage(){
  fetch('https://dog.ceo/api/breeds/image/random/3', {
    method
  })
}