require 'spec_helper'

describe Nyaplot::Jsonizable do
  before(:all) do
    module Nyaplot
      class Hoge
        include Jsonizable
        define_properties(:hoge, :huga)
        define_group_properties(:options, [:nya])

        def initialize
          init_properties
          options({})
        end
      end
    end
  end

  context ".define_properties" do
    it "define getter and setter" do
      hoge = Nyaplot::Hoge.new
      hoge.huga(2)
      expect(hoge.huga()).to eq(2)
    end
  end

  context ".define_group_properties" do
    before(:each) do
      @hoge = Nyaplot::Hoge.new
    end

    it "prepare method whose name is the same as the name of group" do
      @hoge.options({nya: 1})
      expect(@hoge.nya()).to eq(1)
    end

    it "prepare method whose name is included in the second argument" do
      @hoge.nya(2)
      expect(@hoge.nya()).to eq(2)
    end
  end

  context ".before_to_json" do
    it "excuted before running '#to_json'" do
      module Nyaplot
        class Hoge
          def before_to_json
            hoge("hoge")
          end
        end
      end
      hoge = Nyaplot::Hoge.new
      expect(hoge.hoge).to eq(nil)
      hoge.to_json
      expect(hoge.hoge).to eq("hoge")
    end
  end

  context ".set_property" do
    it "should set value to properties" do
      hoge = Nyaplot::Hoge.new
      hoge.set_property(:hoge, "hoge")
      expect(hoge.hoge).to eq("hoge")
    end
  end

  context ".get_property" do
    it "shoud get value from properties" do
      hoge = Nyaplot::Hoge.new
      hoge.hoge("hoge")
      expect(hoge.get_property(:hoge)).to eq("hoge")
    end
  end
end
