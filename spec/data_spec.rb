require 'spec_helper'

describe Nyaplot::DataFrame do
  before(:all) do
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

  context ".column" do
    it "should return an instance of Nyaplot::Series" do
      expect(@df.column(:a).is_a? Nyaplot::Series).to eq(true)
    end

    it "should accept both Symbol and String to specify column name" do
      expect(@df.column(:a).to_a).to eq(@column_a_arr)
      expect(@df.column("a").to_a).to eq(@column_a_arr)
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
