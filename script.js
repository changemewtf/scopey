var elDefinition = document.getElementById("definition");
var elWord = document.getElementById("word");
var elSlides = document.getElementById("slides");

function createElement(tag, className, tap) {
  var el = document.createElement(tag);
  if(className) { el.className += className; }
  if(tap) { tap(el) };
  return el;
}

function createShowMetaListener(element, word, definition) {
  element.addEventListener("mouseover", function() {
    elDefinition.appendChild(document.createTextNode(definition));
    elWord.appendChild(document.createTextNode(word));
  });
}

function createHideMetaListener(element) {
  element.addEventListener("mouseout", function() {
    elDefinition.innerHTML = "";
    elWord.innerHTML = "";
  });
}

function createHoverWord(word, definitionKey) {
  return createElement("span", "word", function(span) {
    span.textContent = word;
    span.className += " " + definitionKey;
    createShowMetaListener(span, word, data["definitions"][definitionKey]);
    createHideMetaListener(span);
  });
}

function attachSemicolon(elSlide) {
  elSlide.lastChild.className += " precedes-a-semicolon";
  elSlide.appendChild(createHoverWord(";", "semicolon"));
}

function generateSlide(slide) {
  return createElement("div", "slide", function(elDiv) {
    slide["words"].forEach(function(word) {
      elDiv.appendChild(createHoverWord(word.text, word.key));
    });

    if(slide.semi) {
      attachSemicolon(elDiv);
    }
  });
}

data["slides"].forEach(function(slide) {
  elSlides.appendChild(generateSlide(slide));
});
