require 'spec_helper'

describe Nyaplot::DataFrame do
  before(:each) do
    @df = Nyaplot::DataFrame.new({a: [10, 30], b: [20, 40]})
    @column_a_arr = [10, 30]
  end

  context ".from_csv" do
    it "should accept a CSV-style converter in a block" do

      path = File.expand_path("../matrix_test.csv", __FILE__)
      df = Nyaplot::DataFrame.from_csv(path, col_sep: ' ', headers: true) do |csv|
        csv.convert do |field, info|
          case info[:header]
          when :true_transform
            field.split(',').map { |s| s.to_f }
          else
            field
          end
        end
      end

      expect(df.column_labels).to eq([:image_resolution, :true_transform, :mls])
      expect(df[:image_resolution].first).to eq(6.55779)
      expect(df.column(:true_transform).first[15]).to eq(1.0)
    end
  end

  context ".initialize" do
    it "should accept Hash in Array style input" do
      df = Nyaplot::DataFrame.new([{a: 10, b: 20}, {a: 30, b: 40}])
      expect(df.row(0)).to eq({a: 10, b: 20})
    end

    it "should accept Array in Hash style input" do
      df = Nyaplot::DataFrame.new({a: [10, 30], b: [20, 40]})
      expect(df.row(0)).to eq({a: 10, b: 20})
    end
  end

  context ".filter" do
    it "should iterate row" do
      @df.filter{|row| expect(row[:a].nil?).to eq(false)}
    end
  end

  context ".filter!" do
    it "should be destructive" do
      arr_before = @df.a.to_a
      @df.filter!{|row| row[:a]/10 == 1}
      arr_after = @df.a.to_a
      expect(arr_after == arr_before).to eq(false)
    end
  end

  context ".name" do
    it "should return secure random name if not specified when initializing" do
      df1 = Nyaplot::DataFrame.new({a: [10, 30], b: [20, 40]})
      df2 = Nyaplot::DataFrame.new({a: [10, 30], b: [20, 40]})
      expect(df1.name != df2.name).to eq(true)
    end
  end

  context ".insert_column" do
    it "should reflect DataFrame#column_labels" do
      @df.insert_column(:hoge, [0,0])
      expect(@df.column_labels.index(:hoge).nil?).to eq(false)
    end
  end

  context ".delete_column" do
    it "should reflect DataFrame#column_labels" do
      @df.delete_column(:a)
      expect(@df.column_labels.index(:a).nil?).to eq(true)
    end
  end

  context ".column" do
    it "should return an instance of Nyaplot::Series" do
      expect(@df.column(:a).is_a? Nyaplot::Series).to eq(true)
    end

    it "should accept both Symbol and String to specify column name" do
      expect(@df.column(:a).to_a).to eq(@column_a_arr)
      expect(@df.column("a").to_a).to eq(@column_a_arr)
    end
  end

  context ".insert_row" do
    it "should insert row to the position specified by the second argument" do
      @df.insert_row({a: 40, b: 30}, 0)
      expect(@df.row(0)).to eq({a: 40, b: 30})
    end
  end

  context ".row" do
    it "should return row at the position specified by the first argument" do
      expect(@df.row(0)).to eq({a: 10, b: 20})
    end
  end

  context ".column_labels" do
    it "should return Array of String" do
      expect(@df.column_labels).to eq([:a, :b])
    end
  end

  context ".each_row" do
    it "should iterate row" do
      @df.each_row do |row|
        row[:b] = 10
      end
      expect(@df.b.to_a).to eq([10, 10])
    end
  end

  context "[]" do
    it "should be an alias for DataFrame#column" do
      expect(@df[:a].to_a).to eq(@column_a_arr)
    end
  end

  context ".method_missing" do
    it "should work as an alias of DataFrame::insert_column when method name includes '='" do
      @df.b = [-20, 20]
      expect(@df.column(:b).to_a).to eq([-20, 20])
    end

    it "should work as an alias of DataFrame::column when method name do not include '='" do
      expect(@df.a.to_a).to eq(@column_a_arr)
    end
  end
end

describe Nyaplot::Series do
  before(:each) do
    df = Nyaplot::DataFrame.new({a: [10, 30], b: [20, 40]})
    @series = df.a
  end

  context "#each" do
    it "should execute received block" do
      sum = 0
      @series.each {|val| sum+=val}
      expect(sum).to eq(40)
    end
  end

  context "#min" do
    it "should calculate minimum value" do
      expect(@series.min).to eq(10)
    end
  end

  context "#max" do
    it "should calculate maximum value" do
      expect(@series.max).to eq(30)
    end
  end

  context "#to_a" do
    it "should return Array" do
      expect(@series.to_a).to eq([10,30])
    end
  end

  context "#label" do
    it "should return String" do
      expect(@series.label).to eq(:a)
    end
  end

  context "#size" do
    it "should delegate to the internal array storage" do
      expect(@series.size).to eq(@series.to_a.size)
    end
  end

  context "#+" do
    it "should add each element of the two Series" do
      another_series = Nyaplot::Series.new('another_series', [20, 40])

      expect((@series + another_series).to_a).to eq( [30, 70] )
    end

    it "should add the number to each element of the Series" do
      number = 10

      expect((@series + number).to_a).to eq( [20, 40] )
    end
  end

  context "#-" do
    it "should subtract the passed Series from the Series" do
      another_series = Nyaplot::Series.new('another_series', [20, 40])

      expect((@series - another_series).to_a).to eq( [-10, -10] )
    end

    it "should subtract the number from the Series" do
      number = 10

      expect((@series - number).to_a).to eq( [0, 20] )
    end
  end

  context "#/" do
    it "should divide each element of the Series by the each element of the passed Series" do
      another_series = Nyaplot::Series.new('another_series', [20.to_f, 40.to_f])

      expect((@series / another_series).to_a).to eq( [10/20.to_f, 30/40.to_f] )
    end

    it "should divide each element of the Series by the passed number" do
      number = 10.to_f

      expect((@series / number).to_a).to eq( [10/10.to_f, 30/10.to_f] )
    end
  end

  context "#*" do
    it "should multiply each element of the two Series together" do
      another_series = Nyaplot::Series.new('another_series', [20, 40])

      expect((@series * another_series).to_a).to eq( [200, 1200] )
    end

    it "should multiply each element of the Series by the number" do
      number = 10

      expect((@series * number).to_a).to eq( [100, 300] )
    end
  end
end
