module Nyaplot
  class MapPlot < Plot
    include Jsonizable
    define_properties(:extension)
    define_group_properties(:axis_extra_options, [:map_data, :color, :text_color, :text_size, :stroke_color])

    def initialize(df, group_label, nested_label)
      super()
      set_property(:axis_extra_options, {})
      map_data(nil)
      extension('Mapnya')
    end

    def add_map(name, data=nil)
      if data.nil?
        path = File.expand_path("../datasets/countries/" + name + ".geo.json", __FILE__)
        map_data(File.read(path))
      else
        map_data(data)
      end
    end

    def before_to_json
      zoom(true)
      width(800) if width.nil?
      height(800) if height.nil?

      if map_data.nil?
        path = File.expand_path("../datasets/world.geo.json", __FILE__)
        map_data(File.read(path))
      end

      self.options[:axis_extra_options] = axis_extra_options
    end
  end
end
