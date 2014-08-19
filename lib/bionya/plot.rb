module Nyaplot
  class CircularPlot < Plot
    include Jsonizable
    undef_method :add_with_df
    define_properties(:extension)
    # @!attribute inner_radius
    #   @return [Numeric] the inner radius of circle
    # @!attribute outer_radius
    #   @return [Numeric] the outer radius of circle
    # @!attribute chord
    #   @return [Boolean] boolean to decide whether chord is added to the circular plot
    # @!attribute color
    #   @return [Array<String>] array of colors
    # @!attribute text_color
    #   @return [String] the color of text
    # @!attribute text_size
    #   @return [Numeric] the size of text of groups
    # @!attribute fill_by
    #   @return [Symbol] the name of column that decides what colors to be filled in
    # @!attribute padding
    #   @return [Numeric] padding between two group arcs
    define_group_properties(:axis_extra_options, [:df_id, :inner_radius, :outer_radius, :group_by, :axis, :chord, :matrix, :inner_num, :outer_num, :color, :text_color, :text_size, :fill_by, :padding])

    # @param [DataFrame] df
    # @param [Symbol] group_label The column which contains names of groups
    # @param [Symbol] nested_label The column which contains dataframe
    def initialize(df, group_label, nested_label)
      super()
      @df = df
      @inner_num = 0
      @outer_num = 1
      @nested_label = nested_label

      set_property(:axis_extra_options, {})
      group_by(group_label)
      color(['#253494'])
      extension('Bionya')
    end

    # Add chord to the plot
    # @param [Array<Array>] matrix
    # @see https://github.com/mbostock/d3/wiki/Chord-Layout
    def add_chord(matrix)
      @matrix = matrix
    end

    # Add connector to the plot
    # @param [DataFrame] df
    # @param [Symbol] from the column label
    # @param [Symbol] to the column label
    # @return [Diagram]
    def add_connector_with_df(df, from, to)
      diagram = Diagram.new(df, :connector, [from, to])
      self.diagrams.push(diagram)
      return diagram
    end

    # Add diagram to the plot
    # @param [Numeric] layer The number of layer where the plot is placed (0 is the grouped arc, 1, 2, ... are the outside of circle, -1, -2, .. is the inside of circle)
    # @param [Symbol] type The type of plot to add
    # @param [Array<Symbol>] labels
    # @return [Diagram]
    def add(layer, type, *labels)
      if(layer>0)
        @outer_num += 1
      elsif
        @inner_num += 1
      end

      diagram = Diagram.new(@df, type, labels.push(@nested_label))
      diagram.layer(layer)
      @axis = diagram.x
      self.diagrams.push(diagram)
      return diagram
    end

    def before_to_json
      zoom(true)
      width(800) if width.nil?
      height(800) if height.nil?

      inner_num(@inner_num)
      outer_num(@outer_num)
      df_id(@df.name)
      axis(@axis)

      self.options[:axis_extra_options] = axis_extra_options
    end
  end
end
