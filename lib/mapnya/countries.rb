module Nyaplot
  # The wrapper for countries
  # @see https://github.com/mledoze/countries
  # @see http://nbviewer.ipython.org/github/domitry/Nyaplot/blob/master/examples/notebook/Mapnya.ipynb
  class Countries
    class << self
      path = File.expand_path("../datasets/countries/countries.json", __FILE__)
      file = File.read(path)
      df = Daru::DataFrame.new(JSON.parse(file))

      # pre-process
      lat = []; lng = []
      df.column(:latlng).each do |latlng|
        lat.push(latlng[0])
        lng.push(latlng[1])
      end
      df.insert_vector(:lat, lat)
      df.insert_vector(:lng, lng)
      df.delete(:latlng)

      # ATA have a problem on coordinate and BMU will cause that all ocean are filled in the same color as BMU's
      df = df.filter_rows {|row| !(row[:lat].nil? || row[:lng].nil? || ["BMU", "ATA"].index(row[:cca3]))}
      df.each_row {|row| row[:area]=0 if row[:area]<0}
      @@df = df

      # World countries list
      # @return [Array<String>] the list of world countries
      def countries_list
        @@df[:name].to_a
      end

      # CCA3 country code
      # @return [Array<String>] tye list of cca3 code
      def cca3_list
        @@df[:cca3].to_a
      end

      # The dataframe as the wrapper of countries
      # @return [DataFrame]
      def df
        @@df
      end
    end
  end
end
