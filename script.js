function build(tag, options) {
  var el = document.createElement(tag);
  if(options.className) { el.className = options.className; }
  if(options.id) { el.id = options.id; }
  if(options.contains) {
    options.contains.forEach(function(child) {
      el.appendChild(child);
    });
  }
  if(options.text) { el.textContent = options.text; }
  if(options.onclick) { el.onclick = options.onclick.bind(this); }
  return el;
}

var Tooltip = {
  word: document.getElementById("word"),
  definition: document.getElementById("definition"),

  createTooltipListeners: function(element, word, definition) {
    element.addEventListener("mouseover", function(event) {
      this.word.appendChild(word);
      this.definition.appendChild(definition);
      event.stopPropagation();
    }.bind(this), true);
    element.addEventListener("mouseout", function() {
      this.word.removeChild(word);
      this.definition.removeChild(definition);
      event.stopPropagation();
    }.bind(this), true);
  },

  createHover: function(word, definition) {
    var hover = build("span", {className: "word"});
    this.createTooltipListeners(
      hover,
      document.createTextNode(word),
      document.createTextNode(definition)
    );
    return hover;
  },

  appendControls: function(controls) {
    definition.appendChild(controls);
  }
};

var Slides = {
  slides: data["slides"],
  element: document.getElementById("slides"),

  initialize: function() {
    this.slides.forEach(function(slide) {
      var section = build("section", {className: "code"});
      slide.code.split("\n").forEach(function(line) {
        section.innerHTML += '<p class="line">' + line + '</p>';
      });
      this.element.appendChild(section);
    }.bind(this));
  }
};

var NodeChirurgeon = {
  wrapSelection: function(wrapper, sel) {
    var start = sel.anchorNode;
    if(sel.anchorOffset > 0 && sel.anchorOffset < start.length) {
      start = start.splitText(sel.anchorOffset);
    }
    var end = sel.focusNode;
    if(sel.focusOffset > 0 && sel.focusOffset < end.length) {
      end = end.splitText(sel.focusOffset);
    }

    if(start.parentNode !== end.parentNode) { throw "different parents"; }
    var container = start.parentNode;
    var nodeList = Array.prototype.slice.call(container.childNodes);
    var startIndex = nodeList.indexOf(start);
    var endIndex = nodeList.indexOf(end);
    // right-to-left selection
    if(startIndex > endIndex) {
      // stackoverflow.com/questions/16201656/how-to-swap-two-variables-in-javascript
      endIndex = [startIndex, startIndex = endIndex][0];
    }
    nodeList.slice(startIndex, endIndex).forEach(function(node) {
      wrapper.appendChild(node);
    });

    container.insertBefore(wrapper, container.childNodes[startIndex]);
  }
};

var Editor = {
  except: function(key) {
    console.log("Exception: %s", key);
  },

  addDefinition: function() {
    var selection = document.getSelection();
    var word = selection.toString();
    if(word.length == 0) { this.except("no selection"); }
    var definition = this.defInput.value;
    if(definition.length == 0) { this.except("no definition"); }
    this.defInput.value = "";

    NodeChirurgeon.wrapSelection(
      Tooltip.createHover(word, definition),
      selection
    );
  },

  activate: function() {
    this.defButton = build("button", {
      id: "add-definition",
      text: "Define",
      onclick: this.addDefinition.bind(this)
    });
    this.defInput = build("input", {id: "write-definition"});
    this.defControls = build("div", {
      id: "definition-controls",
      contains: [this.defInput, this.defButton]
    });

    Tooltip.appendControls(this.defControls);
  }
};

Slides.initialize();
Editor.activate();
