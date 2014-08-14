module Nyaplot
  class MapPlot < Plot
    include Jsonizable
    define_properties(:extension)
    define_group_properties(:axis_extra_options, [:map_data, :color, :text_color, :text_size, :stroke_color, :center, :scale, :no_data_color, :df_id, :cca3, :fill_by])

    def initialize
      super()
      set_property(:axis_extra_options, {})
      map_data(nil)
      extension('Mapnya')
    end

    def add_map(name, data=nil)
      if data.nil?
        path = File.expand_path("../datasets/countries/data/" + name.downcase + ".geo.json", __FILE__)
        map_data(JSON.parse(File.read(path)))
      else
        map_data(data)
      end
    end

    def df_list
      arr = super()
      return arr if df_id.nil?
      return arr.push(df_id)
    end

    def fill_map_with_df(df, id_column, fill_by_column)
      cca3(id_column)
      fill_by(fill_by_column)
      df_id(df.name)
      DataBase.instance.add(df)
    end

    def before_to_json
      zoom(true)
      width(800) if width.nil?
      height(800) if height.nil?

      if map_data.nil?
        path = File.expand_path("../datasets/world.geo.json", __FILE__)
        map_data(JSON.parse(File.read(path)))
      end

      self.options[:axis_extra_options] = axis_extra_options
    end
  end
end
