require 'spec_helper'

describe Nyaplot do
  context ".init_iruby" do
    it "should raise error if IRuby is not loaded." do
      expect{Nyaplot.init_iruby}.to raise_error(RuntimeError)
    end
  end

  # Tell the name of new JS extension library to Nyaplotjs
  context ".add_extension" do
    it "should add extension name to lists" do
      Nyaplot.add_extension("Hoge")
      expect(Nyaplot.extension_lists.index("Hoge").nil?).to eq(false)
    end
  end

  # Add extension libraries loaded before Nyaplot.js
  context ".add_dependency" do
    it "should register name and url of the new dependent library" do
      Nyaplot.add_dependency("Hoge","http://www.hoge.com")
      module Nyaplot
        $dep_libraries = @@dep_libraries
      end
      expect($dep_libraries.keys.index("Hoge").nil?).to eq(false)
      expect($dep_libraries.values.index("http://www.hoge.com").nil?).to eq(false)
    end
  end

  # Add extension libraries loaded after Nyaplot.js
  context ".add_additional_library" do
    it "should register name and url of the new additional library" do
      Nyaplot.add_additional_library("Hoge","http://www.hoge.com")
      module Nyaplot
        $additional_libraries = @@additional_libraries
      end
      expect($additional_libraries.keys.index("Hoge").nil?).to eq(false)
      expect($additional_libraries.values.index("http://www.hoge.com").nil?).to eq(false)
    end
  end
end
