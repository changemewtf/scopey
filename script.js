var elDefinition = document.getElementById("definition");
var elWord = document.getElementById("word");
var elSlides = document.getElementById("slides");

function createElement(tag, className, tap) {
  var el = document.createElement(tag);
  if(className) { el.className += className; }
  if(tap) { tap(el) };
  return el;
}

function createTooltipListeners(element, wordTextNode, definition) {
  var tipWord = wordTextNode.cloneNode();
  var tipDef = document.createTextNode(definition);
  element.addEventListener("mouseover", function() {
    elWord.appendChild(tipWord);
    elDefinition.appendChild(tipDef);
  });
  element.addEventListener("mouseout", function() {
    elWord.removeChild(tipWord);
    elDefinition.removeChild(tipDef);
  });
}

function createHoverWord(wordTextNode, definition) {
  return createElement("span", "word", function(span) {
    span.appendChild(wordTextNode);
    createTooltipListeners(span, wordTextNode, definition);
  });
}

data["slides"].forEach(function(slide) {
  createElement("section", "code", function(section) {
    slide.code.split("\n").forEach(function(line) {
      section.innerHTML += '<p class="line">' + line + '</p>';
    });
    elSlides.appendChild(section);
  });
});

var Editor = {
  makeElement: function(tag, options) {
    var el = document.createElement(tag);
    if(options.id) { el.id = options.id; }
    if(options.contains) {
      options.contains.forEach(function(child) {
        el.appendChild(child);
      });
    }
    if(options.text) { el.textContent = options.text; }
    if(options.onclick) { el.onclick = options.onclick.bind(this); }
    return el;
  },

  except: function(key) {
    console.log("Exception: %s", key);
  },

  addDefinition: function() {
    var selection = document.getSelection();
    if(selection.toString().length == 0) { this.except("no selection"); }
    var range = selection.getRangeAt(0).cloneRange();
    var start = selection.anchorOffset;
    var end = selection.focusOffset - start;
    var nodeBefore = selection.anchorNode;
    var line = nodeBefore.parentNode;
    var selectedTextNode = nodeBefore.splitText(start);
    var nodeAfter = selectedTextNode.splitText(end);
    var definition = this.defInput.value;
    if(definition.length == 0) { this.except("no definition"); }
    var newElement = createHoverWord(selectedTextNode, definition);
    line.insertBefore(newElement, nodeAfter);
  },

  activate: function() {
    this.defButton = this.makeElement("button", {
      id: "add-definition",
      text: "Define",
      onclick: this.addDefinition
    });
    this.defInput = this.makeElement("input", {id: "write-definition"});
    this.definitionControls = this.makeElement("div", {
      id: "definition-controls",
      contains: [this.defInput, this.defButton]
    });

    elDefinition.appendChild(this.definitionControls);
  }
};

Editor.activate();
