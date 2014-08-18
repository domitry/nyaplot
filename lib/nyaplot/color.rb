require 'nyaplot'
require 'json'

module Nyaplot
  class Colors
    class << self
      path = File.expand_path("../colorbrewer/colorbrewer.json", __FILE__)
      color_set = JSON.parse(File.read(path))
      color_set.each do |name, colors|
        nums = colors.keys
        nums.delete("type")
        define_method(name.intern) {|required_num=nil|
          arr =  (required_num.nil? ? colors[nums.max] : colors[required_num.to_s])
          return Color.new(arr)
        }
      end

      define_method(:lists) {color_set.keys}
      define_method(:sample) {self.send(color_set.keys.sample)}

      define_method(:seq) {|num=nil|
        seq = color_set.select{|name, colors| colors["type"] == "seq"}
        self.send(seq.keys.sample, num)
      }

      define_method(:qual) {|num=nil|
        seq = color_set.select{|name, colors| colors["type"] == "qual"}
        self.send(seq.keys.sample, num)
      }

      define_method(:div) {|num=nil|
        seq = color_set.select{|name, colors| colors["type"] == "div"}
        self.send(seq.keys.sample, num)
      }

      alias_method :hot, :YlOrRd
      alias_method :jet, :RdYlBu
      alias_method :binary, :Greys
    end
  end

  class Color
    def initialize(arr)
      @source = arr
    end

    def to_a
      @source
    end

    def to_html
      html = '<table><tr>'
      @source.each{|color| html.concat("<th>" + color + "</th>")}
      html.concat("</tr><tr>")
      @source.each{|color| html.concat("<td style=\"background-color:" + color + ";\">&nbsp;</td>")}
      html += '</tr></table>'
      return html
    end

    def to_json(*args)
      @source.to_json
    end
  end
end
