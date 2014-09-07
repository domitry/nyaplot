require 'spec_helper'

describe Array do
  context "#mean" do
    it "should calculate the mean of its entries" do
      expect([1,2,3,4,5].mean).to eq 3.0
    end
  end

  context "#median" do
    it "should calculate the median of an odd number of entries" do
      expect([1,2,3,4,5].median).to eq 3
    end

    it "should calculate the median of an even number of entries" do
      expect([1,2,3,4,5,6].median).to eq 3.5
    end
  end

  context "#modes" do
    it "should find the only mode (where only one exists)" do
      expect([1,3,2,3,4,5].modes.size).to  eq 1
      expect([1,3,2,3,4,5].modes.first).to eq 3
    end

    it "should find both modes (where two exist) in sorted order" do
      expect([3,3,1,3,1,2,1,4,4].modes.size).to eq 2
      expect([3,3,1,3,1,2,1,4,4].modes).to eq([1,3])
    end
  end
end