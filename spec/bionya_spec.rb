require 'spec_helper'
require 'bionya'

describe "Bionya" do

  context "core" do
    it "should register the namespace of JS back-end" do
      expect(Nyaplot.extension_lists.index("Bionya").nil?).to eq(false)
    end
  end
end

describe Nyaplot::CircularPlot do
  before(:each) do
    df = Daru::DataFrame.new([{name:'hoge', 
      df: [{axis: 0, val: 3, label:'a'},{axis: 1, val: 3, label:'a'}]}, 
      {name:'huga', df: [{axis: 2, val: 3, label:'a'},{axis: 3, val: 3, label:'a'}]}])
    df.each_row{|row| row[:df] = Daru::DataFrame.new(row[:df])}
    @df = df
    @plot = Nyaplot::CircularPlot.new(df, :name, :df)
  end

  context ".add_connector_with_df" do
    it "should register diagram" do
      df = Daru::DataFrame.new({from: ['hoge.1', 'huga.2'], to: ['hoge.1', 'huga.1']})
      @plot.add_connector_with_df(df, :from, :to)
      expect(JSON.parse(@plot.to_json)["diagrams"].any?{|d| d["type"] == "connector"}).to eq(true)
    end
  end

  context ".add" do
    it "should increment inner_num and outer_num" do
      @plot.add(1, :arc, :axis, :val)
      @plot.add(-1, :arc, :axis, :val)
      @plot.to_json
      expect(@plot.inner_num).to eq(1)
      expect(@plot.outer_num).to eq(2)
    end
  end
end

describe Nyaplot::Diagrams do
  before(:each) do
    df = Daru::DataFrame.new([{name:'hoge', df: [{axis: 0, val: 3, label:'a'},{axis: 1, val: 3, label:'a'}]}, {name:'huga', df: [{axis: 2, val: 3, label:'a'},{axis: 3, val: 3, label:'a'}]}])
    df.each_row{|row| row[:df] = Daru::DataFrame.new(row[:df])}
    @df = df
    @plot = Nyaplot::CircularPlot.new(df, :name, :df)
  end

  context "::Arc#process_data"do
    it "should calcurate range of values" do
      arc = @plot.add(1, :arc, :axis, :val)
      expect(arc.range).to eq([0, 3])
    end

    it "should register 'x' and 'y'" do
      arc = @plot.add(1, :arc, :axis, :val)
      expect(arc.x).to eq(:axis)
      expect(arc.y).to eq(:val)
    end
  end

  context "::Labels#process_data"do
    it "should register 'x' and 'text'" do
      labels = @plot.add(1, :labels, :axis, :label)
      expect(labels.x).to eq(:axis)
      expect(labels.text).to eq(:label)
    end
  end

  context "::Connector#process_data"do
    it "should register 'from' and 'to'" do
      df = Daru::DataFrame.new({from: ['hoge.1', 'huga.2'], to: ['hoge.1', 'huga.1']})
      connector = @plot.add_connector_with_df(df, :from, :to)
      expect(connector.from).to eq(:from)
      expect(connector.to).to eq(:to)
    end
  end
end
