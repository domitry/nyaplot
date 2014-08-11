module Nyaplot
  class CircularPlot < Plot
    include Jsonizable
    undef_method :add_with_df
    define_properties(:extension)
    define_group_properties(:axis_extra_options, [:df_id, :inner_radius, :outer_radius, :group_by, :axis, :chord, :matrix, :inner_num, :outer_num, :color, :text_color, :text_size])

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

    def add_chord(matrix)
      @matrix = matrix
    end

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
      print options
    end
  end
end
