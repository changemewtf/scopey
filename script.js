function createHoverWord(word, definition) {
  var span = document.createElement("span");
  span.textContent = word;
  span.className += "word";
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
  var slide = document.createElement("div");
  slide.className += "slide";

  for(var word in words) {
    slide.appendChild(createHoverWord(word, words[word]));
  }

  return slide;
}

var slide = generateSlide(data["slides"][0]["words"]);
document.getElementById("slides").appendChild(slide);
