/*
What we've learned:
- grammars could be transformed to fit simpler parsers
- rules order and grouping matters
- Y combinator rocks
*/

var JSONGrammar = function(All, Any, Capture, Char, NotChar, Optional, Y, EOF, Terminator, Before, After)
{
  
  var Plus = function(rule)
  {
    return Y(function(seq){
      return Any(All(rule, seq), rule)
    })
  }
  
  return Y(function(Value){
    
    var lineSpace     = Plus(Char(" \t"))
    var space         = Plus(Char(" \t\n\r"))
    var optLineSpace  = Optional(lineSpace)
    var optSpace      = Optional(space)
    
    var Constant = function(name)
    {
      return function(text, state) {
        return ((text.substr(0, name.length) == name) ? [text.substr(name.length), state] : null)
      }
    }
    keywords = {'true':true, 'false':false, 'null':null}
    var Keyword = Capture(Any(Constant("true"), Constant("false"), Constant("null")), function(buf, state){ return keywords[buf] })
    
    var StringGrammar = (function()
    {
      var controlCharMap = {
        "b": "\b",
        "f": "\f",
        "n": "\n",
        "r": "\r",
        "t": "\t"
      }
      
      var init        = function(s)      { return "" }
      var anyCapture  = function(buf, s) { return s + buf }
      var ctrlCapture = function(buf, s) { return s + (controlCharMap[buf] || buf) }
      
      var content = function(quote)
      {
        return Y(function(content){
          var anyChar     = NotChar(quote + "\\")
          // js accepts anything after backslash
          var controlChar = NotChar("") // Char("\'\"\\/bfnrt") 

          anyChar = Capture(anyChar, anyCapture)

          controlChar = Capture(controlChar, ctrlCapture)

          var item = Any(
            All(
              Char("\\"),
              controlChar
            ),
            anyChar
          )

          return Any(All(item, content), item)
        })
      }

      var SingleQuotedString = Before(All(
        Char("'"), Optional(content("'")), Char("'")
      ), init)

      var DoubleQuotedString = Before(All(
        Char('"'), Optional(content('"')), Char('"')
      ), init)

      return Any(SingleQuotedString, DoubleQuotedString)
    })()
    
    var ObjectGrammar = (function()
    {
      var init        = function(s)          { return {} }
      var beforeTuple = function(obj)        { return [] }
      var afterTuple  = function(obj, tuple) { obj[tuple[0]] = tuple[1]; return obj }
      var afterKey    = function(tuple, str) { tuple.push(str); return tuple }
      var afterValue  = function(tuple, val) { tuple.push(val); return tuple }
      
      var seq = Y(function(seq){
        var item = All(After(StringGrammar, afterKey), 
                       optSpace, 
                       Char(":"), 
                       optSpace, 
                       After(Value, afterValue))
        item = After(Before(item, beforeTuple), afterTuple)
        return Any(All(item, optSpace, Char(","), optSpace, seq), item)
      })
      
      return Before(All(
        Char("{"), 
        optSpace, Optional(seq), optSpace, Optional(Char(",")), optSpace,
        Char("}")
      ), init)
    })()
    
    var ArrayGrammar = (function()
    {
      var init      = function(s)        { return [] }
      var afterItem = function(arr, val) { return arr.concat([val])  }
      
      var seq = Y(function(seq){
        var item = After(Value, afterItem)
        return Any(All(item, optSpace, Char(","), optSpace, seq), item)
      })
      
      return Before(All(
        Char("["),
        optSpace, Optional(seq), optSpace, Optional(Char(",")), optSpace,
        Char("]")
      ), init)
    })()
    
    var NumberGrammar = (function(){
      
      var zero    = Char("0")
      var digit19 = Char("123456789")
      var digit   = Char("1234567890")
      var sign    = Char("+-")
      var exp     = Char("eE")
      
      var digits = Y(function(digits){
        return Any(All(digit, digits), digit)
      })
      
      var capture = function(buf, s) { return eval("(" + buf + ")") }
      
      var integer  = Any(zero, All(digit19, Optional(digits)))
      var exponent = All(exp, Optional(sign), digits)
      var floating = All(Char("."), digits, Optional(exponent))
      var unsigned = All(integer, Optional(floating))
      
      return Capture(All(Optional(sign), optSpace, unsigned), capture)
      
    })()
    
    return Any(StringGrammar, ObjectGrammar, ArrayGrammar, Keyword, NumberGrammar)
    
  }) 
    
}

var KeywordGrammar = JSONGrammar
var NumberGrammar  = JSONGrammar
var StringGrammar  = JSONGrammar
var ArrayGrammar   = JSONGrammar
var ObjectGrammar  = JSONGrammar
