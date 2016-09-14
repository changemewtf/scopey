function createElement(tag, className=null) {
  var el = document.createElement(tag);
  if(className) { el.className += className; }
  return el;
}

function createHoverWord(word, definition) {
  var span = createElement("span", "word");
  span.textContent = word;
  span.addEventListener("mouseover", function() {
    document.getElementById("definition").appendChild(document.createTextNode(definition));
    document.getElementById("word").appendChild(document.createTextNode(word));
  });
  span.addEventListener("mouseout", function() {
    document.getElementById("definition").innerHTML = "";
    document.getElementById("word").innerHTML = "";
  });
  return span;
}

function generateSlide(words) {
  var slide = createElement("div", "slide");

  for(var word in words) {
    slide.appendChild(createHoverWord(word, words[word]));
  }

  return slide;
}

var slide = generateSlide(data["slides"][0]["words"]);
document.getElementById("slides").appendChild(slide);
