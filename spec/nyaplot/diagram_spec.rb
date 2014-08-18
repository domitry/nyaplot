require 'spec_helper'

describe Nyaplot::Diagram do
  context ".df_name" do
    it "should return the name of dataframe from which the diagram created" do
      df = Nyaplot::DataFrame.new({x:[0,1,2], y:[0,1,2]})
      sc = Nyaplot::Diagram.new(df, :scatter, [:x, :y])
      expect(sc.df_name).to eq(df.name)
    end
  end
end

describe Nyaplot::Diagrams do
  before(:all) do
    @discrete = ['Persian', 'Maine Coon', 'American Shorthair']
    @continuous = [-20,-10,0]
    @continuous_range = [:min, :max].map {|name| @continuous.send(name)}
    @df = Nyaplot::DataFrame.new({discrete: @discrete, continuous: @continuous})
  end

  context "::Bar" do
    it "should calcurate x_range and y_range automatically when specified :x and :y" do
      sc = Nyaplot::Diagram.new(@df, :bar, [:discrete, :continuous])
      expect(sc.xrange).to eq(@discrete)
      expect(sc.yrange).to eq(@continuous_range)
    end

    it "should calcurate x_range and y_range automatically when specified :value" do
      sc = Nyaplot::Diagram.new(@df, :bar, [:discrete])
      expect(sc.xrange).to eq(@discrete)
      expect(sc.yrange).to eq([0, @discrete.length])
    end
  end

  context "::Scatter" do
    it "should calcurate x_range and y_range automatically" do
      sc = Nyaplot::Diagram.new(@df, :scatter, [:continuous, :continuous])
      expect(sc.xrange).to eq(@continuous_range)
      expect(sc.yrange).to eq(@continuous_range)
    end
  end
end
