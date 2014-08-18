require 'spec_helper'

describe Nyaplot::Colors do
  context ".lists" do
    it "should return array of prepared colorset" do
      expect(Nyaplot::Colors.lists.is_a? Array).to eq(true)
    end
  end

  context ".sample" do
    it "return random colorset" do
      expect(Nyaplot::Colors.sample.is_a? Nyaplot::Color).to eq(true)
    end
  end

  context ".hot" do
    it "should be an alias of .YlOrRd" do
      expect(Nyaplot::Colors.hot.to_a).to eq(["rgb(255,255,204)", "rgb(255,237,160)", "rgb(254,217,118)", "rgb(254,178,76)", "rgb(253,141,60)", "rgb(252,78,42)", "rgb(227,26,28)", "rgb(177,0,38)"])
    end
  end
end

describe Nyaplot::Color do
  before(:all) do
    @source = ['#e5f5e0', '#a1d99b','#31a354']
    @color = Nyaplot::Color.new(@source)
  end

  context ".to_a" do
    it "should return Array of String" do
      expect(@color.to_a).to eq(@source)
    end
  end

  context ".to_html" do
    it "should return correct html" do
      html = @color.to_html
      colors = @color.to_html.scan(/background-color:(.+?);/).flatten

      if_brackets_is_same_number = [[/<table(.*?)>/,"</table>"],[/<td(.*?)>/,"</td>"],[/<th(.*?)>/,"</th>"]].all? do |pair|
        html.scan(pair[0]).length == html.scan(pair[1]).length
      end

      expect(if_brackets_is_same_number).to eq(true)
      expect(@source.all?{|hex| !colors.index(hex).nil?}).to eq(true)
    end
  end

  context ".to_json" do
    it "should return correct json" do
      require 'json'
      expect(JSON.parse(@color.to_json)).to eq(@color.to_a)
    end
  end
end
