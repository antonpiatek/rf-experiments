use strict;
use warnings;
package RF::Decoder::Base;

sub new {
  my $pkg = shift;
  bless { @_ }, $pkg;
}

sub is_state {
  $_[0]->{_state} == $_[1];
}

sub set_state {
  $_[0]->{_state} = $_[1];
}

sub is_high {
  $_[0]->{_high};
}

sub set_high {
  $_[0]->{_high} = $_[1];
}

sub toggle_high_low {
  $_[0]->{_high} = !$_[0]->{_high};
}

1;
