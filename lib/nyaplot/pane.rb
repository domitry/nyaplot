module Nyaplot
  # The wrapper for pane of Nyaplotjs
  # (https://github.com/domitry/Nyaplotjs/blob/v2/src/parser/pane.js)
  #
  # @example
  #   p1 = Pane.new.columns(s1, s2)
  #   p2 = Pane.new.columns(s3, s4)
  #   p3 = Pane.new.rows(p1, p2)
  #   p3.to_iruby

  class Pane
    include Nyaplot::Base

    type :pane
    required_args :parent_id, :layout

    def before_to_json
      @uuid = SecureRandom.uuid
      parent_id("vis" + @uuid)
    end

    def add(name, *stages)
      contents = stages.map do |s|
        if s.is_a? Nyaplot::Pane
          s.layout
        else s.is_a? Nyaplot::Stage
          add_dependency(s)
          {sync: s.uuid}
        end
      end
      layout({type: name, contents: contents})
      self
    end

    def self.columns(*stages)
      self.new.add(:columns, *stages)
    end

    def self.rows(*stages)
      self.new.add(:rows, *stages)
    end
  end
end
