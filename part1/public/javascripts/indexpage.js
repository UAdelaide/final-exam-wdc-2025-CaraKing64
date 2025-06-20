// set up vue to be used
const vueinst = new Vue({
  el: "#app",
  data: {
    showing_dog: false, // is the dog showing, changes website layout
    image_url: null // sets the image url
  }
});

// this function toggles the dog showing and hiding
async function toggleDog(){
  vueinst.showing_dog = !vueinst.showing_dog; // toggle dog showing/hiding
  if (vueinst.showing_dog){ // if showing, get the image for the dog
    fetch('https://dog.ceo/api/breeds/image/random') // send GET request
    .then((response) => response.json()) // parse as JSON
    .then((data) => {
      vueinst.image_url = data.message; // set the vue variable
    });
  }
}