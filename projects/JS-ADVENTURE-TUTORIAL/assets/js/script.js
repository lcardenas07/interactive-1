// alert("Hello, World!");
const storage = document.querySelector("#storage");
const exit = document.querySelector("#exit");
const reset = document.querySelector("#reset");

const story = document.querySelector("#story");
const result = document.querySelector("#result");
const ascii = document.querySelector("#ascii");

let hasKey = false;
let doorAttemmts = 0;

storage.addEventListener("click", function () {
  story.textContent = "You look around and find a kid. You talk to the kid.";

  if (!hasKey === false) {
    hasKey = true;
    result.textContent = "The kid gives you a key.";
  } else {
    result.textContent = "The kid has nothing else to give you.";
  }
});

exit.addEventListener("click", function () {
    result.textContent = "You try to open the back door to escape.";

    doorAttemmts= doorAttemmts + 1;
    
    if (hasKey === true) {
        story.textContent = "You use the key to open the door and escape. You win!";
    } else if (doorAttemmts === 1) {
        story.textContent = "The door is locked. You need to find another key.";
    }