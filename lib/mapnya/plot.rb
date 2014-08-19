module Nyaplot
  # Plot Object for Map visualization
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

    # Add the map of individual countries instead of world map
    # @param [String] name the name of country to add
    # @param [Hash] data your own geojson data
    # @example
    #   plot = Nyaplot::MapPlot.new
    #   plot.add_map(JPN) #-> add the map of Japan to the plot
    # @see http://nbviewer.ipython.org/github/domitry/nyaplot/blob/master/examples/notebook/Mapnya3.ipynb
    def add_map(name, data=nil)
      if data.nil?
        path = File.expand_path("../datasets/countries/data/" + name.downcase + ".geo.json", __FILE__)
        map_data = JSON.parse(File.read(path))
        # pre-processing
        map_data["features"].push(map_data["features"][0]) if map_data["features"].length == 1
        country_data = Countries.df.filter{|row| row[:cca3] == name.upcase}.row(0)
        center([country_data[:lng], country_data[:lat]])
        map_data(map_data)
      else
        map_data(data)
      end
    end

    def df_list
      arr = super()
      return arr if df_id.nil?
      return arr.push(df_id)
    end

    # Fill countries in different colors according to some data
    # @param [DataFrame] df
    # @param [Symbol] id_column the column that includes cca3
    # @param [Symbol] fill_by_column the column that includes some values
    # @see http://nbviewer.ipython.org/github/domitry/Nyaplot/blob/master/examples/notebook/Mapnya.ipynb#Case2-:Fill-countries-in-different-colors
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
