function build(tag, options) {
  var element = document.createElement(tag),
      copy    = (k,v) => element[k] = v,
      recipes = {
        className:   copy,
        id:          copy,
        contains:    (k,v) => { v.forEach((c) => element.appendChild(c)) },
        text:        (k,v) => { element.textContent = v },
        textContent: copy,
        onclick:     copy
      };

  for (var k in recipes) {
    if(options[k]) { recipes[k](k, options[k]); }
  }
  return element;
}

var TooltipManager = {
  element: document.getElementById("tooltip"),

  watch: function(element, definition) {
    element.addEventListener("mouseover", (event) => {
      if(!event.firstCaughtBy) { event.firstCaughtBy = element; }
      this.pushTooltip(event.firstCaughtBy, element, definition);
    }, true);

    element.addEventListener("mouseout", this.popTooltip.bind(this), true);
  },

  pushTooltip: function(outer, target, definition) {
    this.element.appendChild(
      build("div", {
        className: "tooltip",
        contains: [
          build("div", {className: "word", contains: [
            this.buildAlignedWord(outer, target)
          ]}),
          build("div", {className: "definition", text: definition})
        ]
      })
    );
  },

  buildAlignedWord: function(outer, target) {
    return this.deepCopy(outer, function(copy, original) {
      if(original.nodeType === Node.ELEMENT_NODE) {
        copy.classList.remove("word");
      }
      if(original === target) {
        copy.className += " shown";
      }
    });
  },

  deepCopy: function(original, editClone) {
    // copy classes, contents, IDs, but no children
    var copy = original.cloneNode();
    editClone(copy, original);
    original.childNodes.forEach((child) => {
      copy.appendChild(this.deepCopy(child, editClone));
    });
    return copy;
  },

  popTooltip: function(event) {
    return this.element.removeChild(this.element.lastChild);
  }
};

// A Slide contains one or more Cells, which helpful Tooltips are attached to.
function Cell(selection, definition) {
  this.word = selection.toString();
  this.definition = definition;

  this.element = build("span", {className: "word"});
  NodeChirurgeon.wrapSelection(this.element, selection);
  TooltipManager.watch(this.element, this.definition);
}

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

// Split, enclose, and reattach nodes with surgical accuracy.
var NodeChirurgeon = {
  wrapSelection: function(wrapper, selection) {
    var [start, end] = this.prepareBoundaries(selection);

    start.parentNode.insertBefore(wrapper, start);

    this.walkSiblings(start, end, (node) => wrapper.appendChild(node));
  },

  walkSiblings: function(start, end, callback) {
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
    var cell = new Cell(
      document.getSelection(),
      this.defInput.value
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
