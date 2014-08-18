require 'spec_helper'

describe Nyaplot::Frame do

  before(:all) do
    @frame = Nyaplot::Frame.new
    @plot = Nyaplot::Plot.new
    @plot.add(:scatter, [0,1,2], [0,1,2])
  end

  context ".add" do
    it "reflect the result to exported JSON" do
      @frame.add(@plot)
      expect(JSON.parse(@frame.to_json)[:panes] != []).to eq(true)
    end
  end

  context ".export_html" do
    it "should return correct html" do
      html = @frame.export_html

      if_brackets_is_same_number = [[/<html(.*?)>/,"</html>"],[/<script(.*?)>/,"</script>"],[/<body(.*?)>/,"</body>"]].all? do |pair|
        html.scan(pair[0]).length == html.scan(pair[1]).length
      end
      expect(if_brackets_is_same_number).to eq(true)
    end
  end
end
