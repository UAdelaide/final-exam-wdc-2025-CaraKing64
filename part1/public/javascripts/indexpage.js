
const vueinst = new Vue({
  el: "#app",
  data: {
    showing_dog: false,
    image_url: null
  }
});

async function toggleDog(){
  vueinst.showing_dog = !vueinst.showing_dog;
  if (vueinst.showing_dog){
    var response = await fetch('https://dog.ceo/api/breeds/image/random');
    vueinst.image_url = response.body.message;
    console.log(vueinst.image_url);
  }
}