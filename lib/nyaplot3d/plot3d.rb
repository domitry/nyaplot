module Nyaplot
  # Plot Object for 3D diagrams
  class Plot3D
    include Jsonizable

    define_properties(:diagrams, :extension)
    # @!attribute width
    #   @return [Numeric] the width of the plot
    # @!attribute height
    #   @return [Numeric] the height of the plotp
    define_group_properties(:options, [:width, :height])

    def initialize
      init_properties
      set_property(:diagrams, [])
      set_property(:options, {})
      set_property(:extension, 'Elegans')
    end

    # Add diagram with Array
    # @param [Symbol] type the type of diagram to add
    # @param [Array<Array>] *data array from which diagram is created
    # @example
    #    plot.add(:surface, [0,1,2], [0,1,2], [0,1,2])
    def add(type, *data)
      df = Daru::DataFrame.new({x: data[0], y: data[1], z: data[2]})
      return add_with_df(df, type, :x, :y, :z)
    end

    # Add diagram with DataFrame
    # @param [DataFrame] DataFrame from which diagram is created
    # @param [Symbol] type the type of diagram to add
    # @param [Array<Symbol>] *labels column labels for x, y or some other dimension
    # @example
    #    df = Daru::DataFrame.new({x: [0,1,2], y: [0,1,2], z: [0,1,2]})
    #    plot.add(df, :surface, :x, :y, :z)
    def add_with_df(df, type, *labels)
      diagram = Diagram3D.new(df, type, labels)
      diagrams = get_property(:diagrams)
      diagrams.push(diagram)
      return diagram
    end

    # Show plot on IRuby notebook
    def show
      Frame.new.tap {|f| f.add(self) }.show
    end

    # Show plot automatically on IRuby notebook
    def to_iruby
      Frame.new.tap {|f| f.add(self) }.to_iruby
    end

    # export html file
    def export_html(path=nil)
      require 'securerandom'
      path = "./plot-" + SecureRandom.uuid().to_s + ".html" if path.nil?
      Frame.new.tap {|f| f.add(self) }.export_html(path)
    end

    # @return [Array<String>] names of dataframe used by diagrams belog to this plot
    def df_list
      diagrams = get_property(:diagrams)
      return diagrams.map{|d| next d.df_name}
    end

    # Shortcut method to configure plot
    # @example
    #    plot = Nyaplot::Plot3D.new
    #    plot.configure do
    #      width(700)
    #      height(700)
    #    end
    def configure(&block)
      self.instance_eval(&block) if block_given?
    end
  end
end
