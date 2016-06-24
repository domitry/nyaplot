require 'spec_helper'
require 'iruby/display'
require 'iruby/utils'

describe Nyaplot do
  it 'should have a version number' do
    Nyaplot::VERSION.should_not be_nil
  end

  describe '.load_notebook' do
    shared_examples 'inline script' do
      it 'loads javascript sources as inline script' do
        expect(IRuby).to receive(:display) do |rep|
          expect(rep).to be_kind_of(IRuby::Display::Representation)
          expect(rep.options[:mime]).to eq('application/javascript')

          # d3.js
          expect(rep.object).to match(/this\.d3=/)

          # d3-downloadable.js
          expect(rep.object).to match(/var downloadable = function downloadable\(\) {/)

          # nyaplot.js
          expect(rep.object).to match(/var Nyaplot = initialize\(\);/)
        end
        expect(load_notebook).to eq(nil)
      end
    end

    context 'without parameters' do
      subject(:load_notebook) { Nyaplot.load_notebook }

      include_examples 'inline script'
    end

    context 'given `assets` parameter is `:inline`' do
      subject(:load_notebook) { Nyaplot.load_notebook(:inline) }

      include_examples 'inline script'
    end

    context 'given `assets` parameter is `:cdn`' do
      subject(:load_notebook) { Nyaplot.load_notebook(:cdn) }

      it 'loads javascript sources from cdn' do
        expect(IRuby).to receive(:display) do |rep|
          expect(rep).to be_kind_of(IRuby::Display::Representation)
          expect(rep.options[:mime]).to eq('application/javascript')
          expect(rep.object).to include('https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.5/d3.min')
          expect(rep.object).to include('http://cdn.rawgit.com/domitry/d3-downloadable/master/d3-downloadable')
          expect(rep.object).to include('http://cdn.rawgit.com/domitry/Nyaplotjs/master/release/nyaplot.js')
        end
        expect(load_notebook).to eq(nil)
      end
    end
  end
end
