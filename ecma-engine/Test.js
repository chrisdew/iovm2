#!/usr/bin/env js
load("Util.js", "Parser.js", "TestGrammar.js", "JSONGrammar.js", "IonGrammar.js")

var test = Parser(function(All, Any, Capture, Char, NotChar, Optional, Y, EOF, Terminator, Before, After) {
  return function(verify)
  {
    (function(verify){
      verify("EOF",          EOF,            "")
      verify("Terminator",   Terminator,     "Quick fox")
      verify("All",          All(Char("a"),Char("b"),EOF),  "ab")
      verify("Any 1",        Any(Char("a"),Char("b"),EOF),  "a")
      verify("Any 2",        Any(Char("a"),Char("b"),EOF),  "b")
      verify("(F) This test should fail with false result", EOF, "Quick fox")
      verify("(E) This test should fail with exception", function(){ throw "test exception thrown!" }, "Quick fox")
    })(function(title, grammar, text){
      return verify(title, grammar, text, 42, 42)
    })
    
    verify("Single quoted string: empty",  Parser(StringGrammar), "''",   "", "")
    verify("Single quoted string: simple", Parser(StringGrammar), "'ab'", "", "ab")
    
  }
})

test(function(title, grammar, text, state, result){
  try {
    var r = (Parse(grammar, text, state) == result)
    if (r)
    {
      print(". " + title)
    }
    else
    {
      print("F " + title + ": result is " + r)
    }
  } catch(e) {
    print("E " + title + ": " + e)
  }
})

