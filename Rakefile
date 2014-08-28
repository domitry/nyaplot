require "bundler/gem_tasks"
require "rspec/core/rake_task"

RSpec::Core::RakeTask.new(:spec)

def run *cmd
  sh(cmd.join(" "))
end

task :console do |task|
  cmd = [ 'irb', "-r './lib/nyaplot.rb'" ]
  run *cmd
end

task :pry do |task|
  cmd = [ 'pry', "-r './lib/nyaplot.rb'" ]
  run *cmd
end

task :default => :spec
