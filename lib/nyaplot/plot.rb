module Nyaplot
  class Plot
    include Jsonizable

    define_properties(Array, :diagrams)
    define_properties(Hash, :filter)
    define_group_properties(:options, [:width, :height, :margin, :xrange, :yrange, :x_label, :y_label, :bg_color, :grid_color, :legend, :legend_width, :legend_options, :zoom])

    def initialize
      set_property(:diagrams, [])
      set_property(:options, {})
    end

    def add(type, *data)
      labels = data.map.with_index{|d, i| 'data' + i.to_s}
      raw_data = data.each.with_index.reduce({}){|memo, (d, i)| memo[labels[i]]=d;next memo}
      df = DataFrame.new(raw_data)
      return add_with_df(df, type, *labels)
    end

    def add_with_df(df, type, *labels)
      diagram = Diagram.new(df, type, labels)
      diagrams = get_property(:diagrams)
      diagrams.push(diagram)
      return diagram
    end

    def show
      frame = Frame.new
      frame.add(self)
      frame.show
    end

    def df_list
      arr=[]
      diagrams = get_property(:diagrams)
      diagrams.each{|d| arr.push(d.df_name)}
      return arr
    end

    def before_to_json
      diagrams = get_property(:diagrams)

      [:xrange, :yrange].each do |symbol|
        if get_property(:options)[symbol].nil?
          range = []
          diagrams.each{|diagram| range.push(diagram.send(symbol))}

          if range.all? {|r| r.length == 2}
            range = range.transpose
            range = [range[0].min, range[1].max]
            self.send(symbol, range)
          else
            range.flatten!.uniq!
            self.send(symbol, range)
          end
        end
      end
    end

    def configure(&block)
      self.instance_eval(&block) if block_given?
    end
  end
end
