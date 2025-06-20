// set up vue to be used
const vueinst = new Vue({
  el: "#app",
  data: {
    showing_dog: false, // is the dog showing, changes website layout
    image_url: null // sets the image url
  }
});

async function toggleDog(){
  vueinst.showing_dog = !vueinst.showing_dog;
  if (vueinst.showing_dog){
    fetch('https://dog.ceo/api/breeds/image/random')
    .then((response) => response.json())
    .then((data) => {
      vueinst.image_url = data.message;
    });
  }
}