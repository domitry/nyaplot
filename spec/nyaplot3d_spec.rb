require 'spec_helper'
require 'nyaplot3d'

describe "Nyaplot3D" do
  context "itself" do
    it "should register the namespace of JS back-end" do
      expect(Nyaplot.extension_lists.index("Elegans").nil?).to eq(false)
    end

    it "should register dependent libraries" do
      module Nyaplot; $dep_libraries = @@dep_libraries; end
      expect($dep_libraries.keys.index("THREE").nil?).to eq(false)
      expect($dep_libraries.keys.index("Elegans").nil?).to eq(false)
    end
  end
end

describe Nyaplot::Diagram3D do
  before(:all) do
    @diagram = Nyaplot::Plot3D.new.add(:surface, [0,1,2], [0,1,2], [0,1,2])
  end

  context ".configure" do
    it "should be a shortcut method for getter/setter as .fill_colors or .has_legend" do
      @diagram.configure do
        fill_colors(['#000', '#fff'])
        has_legend(true)
      end
      expect(@diagram.fill_colors).to eq(['#000', '#fff'])
      expect(@diagram.has_legend).to eq(true)
    end
  end

  context ".df_name" do
    it "should be the alias for Diagram3D#data" do
      expect(@diagram.df_name).to eq(@diagram.data)
    end
  end
end

describe Nyaplot::Diagrams3D do
  before(:each) do
    @plot = Nyaplot::Plot3D.new
  end

  context ".process_data" do
    it "should assign value to 'x', 'y', and 'z' options" do
      surface = @plot.add(:surface, [0,1,2], [0,1,2], [0,1,2])
      expect(surface.x.nil?).to eq(false)
      expect(surface.y.nil?).to eq(false)
      expect(surface.z.nil?).to eq(false)
    end
  end
end

describe Nyaplot::Plot3D do
  before(:each) do
    @plot = Nyaplot::Plot3D.new
    @df = Nyaplot::DataFrame.new({a: [0,1,2], b: [0,1,2], c: [0,1,2]})
  end

  context ".add" do
    it "should create new dataframe" do
      before_df_num = @plot.df_list.length
      @plot.add(:surface, [0,1,2], [0,1,2], [0,1,2])
      after_df_num = @plot.df_list.length
      expect(after_df_num - before_df_num).to eq(1)
    end
  end

  context "add_with_df" do
    it "should register dataframe to plot" do
      @plot.add_with_df(@df, :surface, :a, :b, :c)
      expect(@plot.df_list.index(@df.name).nil?).to eq(false)
    end
  end

  context ".df_list" do
    it "should return Array include the name of DataFrame recieved throgh Plot3D#add_with_df" do
      @plot.add_with_df(@df, :surface, :a, :b, :c)
      expect(@plot.df_list.index(@df.name).nil?).to eq(false)
    end
  end

  context ".configure" do
    it "should receive block to configure" do
      @plot.configure do
        width(700)
        height(700)
      end
      expect(@plot.width).to eq(700)
      expect(@plot.height).to eq(700)
    end
  end
end
