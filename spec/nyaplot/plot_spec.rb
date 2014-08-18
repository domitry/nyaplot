require 'spec_helper'

describe Nyaplot::Plot do
  before(:each) do
    @pair_property_and_expected_value = [[:width,500], [:height,500], [:margin], [:xrange, [-100,100]], [:yrange,[-100, 100]], [:x_label,:hoge], [:y_label,:nya], [:bg_color,"#000"], [:grid_color,"#fff"], [:legend,true], [:legend_width,200], [:legend_options,{}], [:zoom,true], [:rotate_x_label,20],[:rotate_y_label,30]]

    @plot = Nyaplot::Plot.new
    @frame = Nyaplot::Frame.new
    @frame.add(@plot)
  end

  context ".add" do
    it "should affect the result of '#to_json'" do
      @plot.add(:scatter, [0,1,2], [0,1,2])
      result = JSON.parse(@plot.to_json)["diagrams"].any? do |diagram|
        diagram["type"] == "scatter"
      end
      expect(result).to eq(true)
    end

    it "should create new dataframe" do
      df_num_before = @plot.df_list.length
      @plot.add(:scatter, [0,1,2], [0,1,2])
      df_num_after = @plot.df_list.length
      expect(df_num_after-df_num_before).to eq(1)
    end
  end

  context ".add_with_df" do
    it "should register dataframe to itself" do
      df = Nyaplot::DataFrame.new({hoge: [0,1,2], nya: [0,1,2]})
      @plot.add_with_df(df, :line, :hoge, :nya)
      expect(@plot.df_list.index(df.name).nil?).to eq(false)
    end
  end

  context ".width, .height and other options" do
    it "should have getter and setter" do
      @pair_property_and_expected_value.each do |pair|
        @plot.send(pair[0], pair[1])
        expect(@plot.send(pair[0])).to eq(pair[1])
      end
    end
  end

  context ".configure" do
    it "should work as a shortcut for options like .width, .height and others" do
      pairs = @pair_property_and_expected_value
      @plot.configure do
        pairs.each do |pair|
          self.send(pair[0], pair[1])
        end
      end

      pairs.each do |pair|
        expect(@plot.send(pair[0])).to eq(pair[1])
      end
    end
  end
end
