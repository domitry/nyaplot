require 'spec_helper'
require 'mapnya'

describe "Mapnya" do
  context "core" do
    it "should register the namespace of JS back-end" do
      expect(Nyaplot.extension_lists.index("Mapnya").nil?).to eq(false)
    end
  end
end

describe Nyaplot::MapPlot do
  before(:each) do
    @plot = Nyaplot::MapPlot.new
  end

  context ".add_map" do
    it "should assign value to 'center' and 'map_data' options" do
      @plot.add_map("JPN")
      expect(@plot.center.nil?).to eq(false)
      expect(@plot.map_data.nil?).to eq(false)
    end
  end

  context ".df_list" do
    it "should return the list of registered dataframe" do
      @plot.add(:scatter, [0,1,2], [0,1,2])
      expect(@plot.df_list.length).to eq(1)
    end

    it "returned list should contain dataframe registerd by 'Nyaplot::MapPlot#fill_map_with_df'" do
      df = Daru::DataFrame.new({cca3: ["FIN", "FRA", "GUF", "PYF"], val:[0,1,2,3]})
      @plot.fill_map_with_df(df, :cca3, :val)
      expect(@plot.df_list.index(df.name).nil?).to eq(false)
    end
  end

  context ".fill_map_with_df" do
    it "should assign value to 'cca3', 'fill_by', and 'df_id' options" do
      df = Daru::DataFrame.new({cca3: ["FIN", "FRA", "GUF", "PYF"], val:[0,1,2,3]})
      @plot.fill_map_with_df(df, :cca3, :val)
      expect(@plot.cca3.nil?).to eq(false)
      expect(@plot.fill_by.nil?).to eq(false)
      expect(@plot.df_id.nil?).to eq(false)
    end
  end
end

describe Nyaplot::Countries do
  context ".countries_list" do
    it "should return Array consists of country names" do
      result = ["Denmark", "Marshall Islands", "Bulgaria", "Portugal", "Philippines"].all? do |name|
        !Nyaplot::Countries.countries_list.index(name).nil?
      end
      expect(result).to eq(true)
    end
  end

  context ".cca3_list" do
    it "should return Array consists of cca3" do
      result = ["FIN", "FRA", "GUF", "PYF", "ATF", "GAB", "GMB"].all? do |name|
        !Nyaplot::Countries.cca3_list.index(name).nil?
      end
      expect(result).to eq(true)
    end
  end

  context ".df" do
    it "should return instance of Daru::DataFrame" do
      expect(Nyaplot::Countries.df.is_a? Daru::DataFrame).to eq(true)
    end

    it "return DataFrame contains information about :name, :cca3, :capital, and others" do
      result = [:name, :nativeName, :tld, :cca2, :ccn3, :cca3, :currency, :callingCode, :capital, :altSpellings, :relevance, :region, :subregion, :language, :languageCodes, :translations, :demonym, :borders, :area, :lat, :lng].all? do |label|
        !Nyaplot::Countries.df.fields.index(label).nil?
      end
      expect(result).to eq(true)
    end
  end
end
