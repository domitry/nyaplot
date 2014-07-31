require 'spec_helper'
require 'pry'

describe Nyaplot::DataFrame do
  context ".from_csv" do
    it "should accept a CSV-style converter in a block" do

      df = Nyaplot::DataFrame.from_csv("./spec/matrix_test.csv", col_sep: ' ', headers: true) do |csv|
        csv.convert do |field, info|
          case info[:header]
          when 'true_transform'
            field.split(',').map { |s| s.to_f }
          else
            field
          end
        end
      end

      expect(df.column_labels).to eq(["image_resolution", "true_transform", "mls"])
      expect(df.column('true_transform').first[15]).to eq(1.0)
    end
  end
end