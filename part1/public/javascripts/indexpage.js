
const vueinst = new Vue({
  el: "#app",
  data: {
    showing_dog: false,
    image_url: null
  }
});

async function getDogImage(){
  var response = await fetch('https://dog.ceo/api/breeds/image/random');
  vueinst.image_url = response.body.message;
  console.log(vueinst.image_url);
}