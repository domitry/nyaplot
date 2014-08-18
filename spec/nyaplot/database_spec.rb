require 'spec_helper'

describe Nyaplot::DataBase do
  context ".instance" do
    it "should return the instance of DataBase" do
      expect(Nyaplot::DataBase.instance.is_a? Singleton).to eq(true)
    end
  end

  context ".add" do
    it "should register dataframe specified in the first argument to database" do
      df = Nyaplot::DataFrame.new({a: [0,1,2]})
      Nyaplot::DataBase.instance.add(df)
      expect(Nyaplot::DataBase.instance.fetch(df.name)).to eq(df)
    end
  end
end
