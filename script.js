function build(tag, options) {
  var element = document.createElement(tag),
      copy    = (k,v) => element[k] = v,
      recipes = {
        className:   copy,
        id:          copy,
        contains:    (k,v) => { v.forEach((c) => element.appendChild(c)) },
        textContent: copy,
        onclick:     copy
      };

  for (var k in recipes) {
    if(options[k]) { recipes[k](k, options[k]); }
  }
  return element;
}

var Tooltip = {
  element: document.getElementById("tooltip"),

  toggle: function(action, word, definition) {
    this.element[action](word);
    this.element[action](definition);
  },

  createTooltipListeners: function(element, word, definition) {
    element.addEventListener("mouseover", (event) => {
      this.toggle("appendChild", word, definition);
    }, true);
    element.addEventListener("mouseout", (event) => {
      this.toggle("removeChild", word, definition);
    }, true);
  },

  createHover: function(word, definition) {
    var hover = build("span", {className: "word"});
    this.createTooltipListeners(
      hover,
      build("div", {className: "word", textContent: word}),
      build("div", {className: "definition", textContent: definition})
    );
    return hover;
  },
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
  },

  appendControls: function(controls) {
    this.element.appendChild(controls);
  }
};

/* Split, enclose, and reattach nodes with surgical accuracy. */

var NodeChirurgeon = {
  wrapSelection: function(wrapper, selection) {
    var [start, end] = this.prepareBoundaries(selection);

    start.parentNode.insertBefore(wrapper, start);

    this.walkThroughSiblings(start, end, function(node) {
      wrapper.appendChild(node);
    });
  },

  walkThroughSiblings: function(start, end, callback) {
    var cache, cursor = start;
    do {
      // cache the next sibling, since we're expecting to move
      // the cursor node around within the DOM hierarchy
      cache = cursor.nextSibling;
      callback(cursor);
      cursor = cache;
    } while (cursor != end);
  },

  prepareBoundaries: function(selection) {
    var start = this.prepare(selection.anchorNode, selection.anchorOffset);
    var end = this.prepare(selection.focusNode, selection.focusOffset);
    if(this.userDraggedRightToLeft(start, end)) {
      return [end, start];
    } else {
      return [start, end];
    }
  },

  userDraggedRightToLeft: function(a, b) {
    // http://stackoverflow.com/a/23512678/16034
    return a.compareDocumentPosition(b) === Node.DOCUMENT_POSITION_PRECEDING;
  },

  prepare: function(node, offset) {
    if(offset > 0 && offset < node.length) {
      // selected in the middle: Hello[, world!]
      return node.splitText(offset);
    } else {
      // selected at a boundary: [Hello, world!]
      return node;
    }
  }
};

var Editor = {
  addDefinition: function() {
    var selection = document.getSelection();        // shhhh. shhhhh, it's ok. just ignore these
    var word = selection.toString();                if(word.length == 0) { throw "no selection"; }
    var definition = this.defInput.value;           if(definition.length == 0) { throw "no definition"; }

    NodeChirurgeon.wrapSelection(
      Tooltip.createHover(word, definition),
      selection
    );

    this.defInput.value = "";
  },

  buildControls: function() {
    this.defButton   = build("button", {
                         id: "add-definition",
                         textContent: "Define",
                         onclick: this.addDefinition.bind(this)
                       });
    this.defInput    = build("input", {
                         id: "write-definition"
                       });
    this.defControls = build("div", {
                         id: "definition-controls",
                         contains: [this.defInput, this.defButton]
                       });
  },

  activate: function() {
    this.buildControls();
    Slides.appendControls(this.defControls);
  }
};

Slides.initialize();
Editor.activate();
