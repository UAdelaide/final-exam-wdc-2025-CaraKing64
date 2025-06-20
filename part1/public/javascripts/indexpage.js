
const vueinst = new Vue({
  el: "#app",
  data: {
    showing_dog: false,
    imageurl: null,
  }
});

async function getDogImage(){
  var response = await fetch('https://dog.ceo/api/breeds/image/random/3', {
    method: 
  })
}